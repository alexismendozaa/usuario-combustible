import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

/**
 * Tests E2E simplificados - sin dependencias complejas
 * Prueba unitaria del controlador y servicio principal
 */
describe('App E2E Tests', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = moduleFixture.get<AppController>(AppController);
    appService = moduleFixture.get<AppService>(AppService);
  });

  describe('AppController', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });

    it('should return Hello World', () => {
      const result = appController.getHello();
      expect(result).toBe('Hello World!');
      expect(typeof result).toBe('string');
    });
  });

  describe('AppService', () => {
    it('should be defined', () => {
      expect(appService).toBeDefined();
    });

    it('should return Hello World', () => {
      const result = appService.getHello();
      expect(result).toBe('Hello World!');
    });
  });

  describe('Integration', () => {
    it('controller should use service correctly', () => {
      const serviceResult = appService.getHello();
      const controllerResult = appController.getHello();
      expect(controllerResult).toBe(serviceResult);
    });
  });
});
