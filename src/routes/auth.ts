import express, {Router} from "express";
import bodyParser from "body-parser";

import User from '../models/user/User';

import * as permissions from '../services/permissions';
import {fetchSAMLBundle, fetchSP} from "../services/multisaml";

const router : Router = express.Router();
const parseURLEncoded = bodyParser.urlencoded({
    extended: true
})


// Endpoint to retrieve metadata
router.get("/:provider/metadata.xml", async function(req, res) {
    const sp = await fetchSP(req.params.provider.toLowerCase());
    res.type('application/xml');
    res.send(sp.create_metadata());
});

// Starting point for login
router.get("/:provider/login", async function(req, res) {
    const {sp, idp} = await fetchSAMLBundle(req.params.provider.toLowerCase());
    sp.create_login_request_url(idp, {}, function(err, login_url, request_id) {
        if (err != null)
            return res.send(500);

        return res.json({
            loginUrl: login_url
        })
    });
});

// Assert endpoint for when login completes
router.post("/:provider/acs", async function(req, res) {
    const options = {request_body: req.body};
    const {sp, idp} = await fetchSAMLBundle(req.params.provider.toLowerCase());
    sp.post_assert(idp, options, async function(err, saml_response) {
        if (err != null){
            console.log(err);
            return res.send(500);
        }

        console.log(saml_response);

        if(saml_response.type == 'logout_request'){
            /*
            logout_request is called when a logout is generated from another application.
            We need to destroy the user's session on our end and redirect back to the IDP.
             */

            //definition is wrong for this type
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            const name_id = saml_response.name_id;
            // const session_index = saml_response.user.session_index;

            // remote slo logout, revoke all tokens issued before now
            try {
                await User.findOneAndUpdate({
                    samlNameID: name_id
                }, {
                    lastLogout: Date.now()
                });

            } catch (e) {
                console.log(e);
                console.log("Unable to revoke past sessions.");
            }

            sp.create_logout_response_url(idp, {
                in_response_to: saml_response.response_header.id
            }, function(error, response_url) {
                return res.redirect(response_url);
            })

        }
        else if(saml_response.type == 'logout_response'){
            // finished logging out of all applications
            // res.redirect("/finishLogout");
            return res.json({
                status: "OK"
            })
        }
        else {
            // Receives the IDP's response after an authentication request.
            const name_id = saml_response.user.name_id;
            const assertAttributes = saml_response.user.attributes;

            // IDP did not send enough data, probably forgot to set up mappers.
            if(!assertAttributes.email || !assertAttributes.firstName || !assertAttributes.lastName) {
                throw Error('Missing SAML fields.');
            }

            try {
                const userInfo = await User.findOneAndUpdate({
                    samlNameID: name_id,
                }, {
                    email: assertAttributes.email[0],
                    firstName: assertAttributes.firstName[0],
                    lastName: assertAttributes.lastName[0]
                }, {
                    upsert: true,
                    new: true
                });

                const token = permissions.createJwt({
                    id: userInfo._id,
                    samlNameID: name_id,
                    samlSessionIndex: saml_response.user.session_index,
                    groups: assertAttributes.groups
                })

                return res.json({
                    token: token
                })
            }
            catch(e){
                console.log("Error logging user in.");
                console.log(e);
            }

        }
    });
});

// Starting point for logout
router.post("/:provider/logout", async function(req, res) {
    if(!req.body.token){
        return res.status(400).json({
            status: 400,
            error: "Bad request"
        })
    }

    const {sp, idp} = await fetchSAMLBundle(req.params.provider.toLowerCase());

    const tokenInfo = permissions.verifyToken(req.body.token);

    sp.create_logout_request_url(idp, {
        name_id: tokenInfo.samlNameID,
        session_index: tokenInfo.samlSessionIndex
    }, function(err, logout_url) {
        if (err != null)
            return res.send(500);

        return res.json({
            logoutUrl: logout_url
        })
    });
});
export default router;
