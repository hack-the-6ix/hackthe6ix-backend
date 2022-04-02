const opentelemetry = require('@opentelemetry/api');

const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { ConsoleSpanExporter, SimpleSpanProcessor, BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { TraceExporter } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// const provider = new NodeTracerProvider({
//   resource: new Resource({
//     [SemanticResourceAttributes.SERVICE_NAME]: serviceName, // Service name that showuld be listed in jaeger ui
//     [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
//   }),
// })
// const spanProcessor = new SimpleSpanProcessor(exporter);
// provider.addSpanProcessor(spanProcessor);
// provider.register()

// registerInstrumentations({
//     instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation()],
// })
const init = (serviceName: String) => {

  const exporter = new TraceExporter();

  // const consoleExporter = new ConsoleSpanExporter();
  const spanProcessor = new SimpleSpanProcessor(exporter);

  // NodeTracerProvider instead of NodeSDK
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });

  // add the same auto-instrumentations used with the Node SDK
  registerInstrumentations({
    instrumentations: [getNodeAutoInstrumentations()]
  });

  provider.addSpanProcessor(spanProcessor);
  provider.register()
}

module.exports = {
  init: init,
}



// module.exports = () => {
//   console.log('hello')
//   const serviceName = 'ht6-testing';
//   const provider = new NodeTracerProvider({
//     resource: new Resource({
//       [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
//     }),
//   });

//   registerInstrumentations({
//     tracerProvider: provider,
//     instrumentations: [
//       // Express instrumentation expects HTTP layer to be instrumented
//       HttpInstrumentation,
//       ExpressInstrumentation,
//     ],
//   });

//   const exporter = new ConsoleSpanExporter();

// //   const exporter = new TraceExporter({
// //     keyFile: './service_account_key.json',
// //     keyFileName: './service_account_key.json',
// //   });

//   const spanProcessor = new SimpleSpanProcessor(exporter);
// //   const spanProcessor = new BatchSpanProcessor(exporter);

//   provider.addSpanProcessor(spanProcessor);

//   provider.register();

//   return opentelemetry.trace.getTracer('ht6-testing');
// };
