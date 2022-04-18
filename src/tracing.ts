import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ConsoleSpanExporter, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';

export const init = (serviceName: string) => {  
  const exporter = process.env.NODE_ENV === 'production' ?
    new TraceExporter({
      projectId: process.env.GCP_TRACING_PROJECTID,
      keyFile: process.env.GCP_TRACING_KEYFILEPATH
    })
    :
    new ConsoleSpanExporter();

  const spanProcessor = new BatchSpanProcessor(exporter);

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new MongoDBInstrumentation()
    ]
  });

  provider.addSpanProcessor(spanProcessor);
  provider.register()
}
