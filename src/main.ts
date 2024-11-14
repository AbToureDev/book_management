import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Collection de livres')
    .setDescription(
      'Créer une API qui permet de gérer une collection de livres et leurs auteurs',
    )
    .setVersion('1.0')
    .addTag('Books Collection')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.use(helmet());
  app.enableCors();
  app.use(cookieParser());
  await app.listen(port);
  console.log(`Pour la connection a swagger:http://localhost:${port}/api`);
}
bootstrap();
