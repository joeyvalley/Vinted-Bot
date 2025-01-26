import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import redis from 'redis-mock';
import sinon from 'sinon';
import UserConfig from '../src/config/userConfig.js';
import { logger } from '../src/utils/logger.js';

describe('User Configuration System', () => {
    let userConfig;
    let redisClient;
    let loggerStub;

    beforeEach(() => {
        redisClient = redis.createClient();
        userConfig = new UserConfig('test-user', redisClient);
        loggerStub = sinon.stub(logger, 'error');
    });

    afterEach(() => {
        redisClient.flushall();
        loggerStub.restore();
    });

    describe('Configuration Validation', () => {
        it('should accept valid configuration', async () => {
            const validConfig = {
                searchParams: {
                    brand: ['nike', 'adidas'],
                    price: { min: 10, max: 100 },
                    size: ['M', 'L']
                },
                notificationPreferences: {
                    frequency: 'hourly',
                    maxPrice: 50
                }
            };

            await userConfig.setConfig(validConfig);
            const savedConfig = await userConfig.getConfig();
            expect(savedConfig).to.deep.equal(validConfig);
        });

        it('should reject invalid configuration', async () => {
            const invalidConfig = {
                searchParams: {
                    brand: 'nike', // Should be array
                    price: 'invalid' // Should be object
                }
            };

            try {
                await userConfig.setConfig(invalidConfig);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.message).to.include('Validation failed');
            }
        });
    });

    describe('Redis Persistence', () => {
        it('should persist configuration in Redis', async () => {
            const config = {
                searchParams: {
                    brand: ['nike']
                }
            };

            await userConfig.setConfig(config);
            const savedConfig = await userConfig.getConfig();
            expect(savedConfig).to.deep.equal(config);
        });

        it('should handle Redis errors', async () => {
            sinon.stub(redisClient, 'set').throws(new Error('Redis error'));
            
            try {
                await userConfig.setConfig({});
                expect.fail('Should have thrown Redis error');
            } catch (error) {
                expect(error.message).to.include('Redis error');
                expect(loggerStub.called).to.be.true;
            }
        });
    });

    describe('Configuration Management', () => {
        it('should delete configuration', async () => {
            await userConfig.setConfig({ searchParams: {} });
            await userConfig.deleteConfig();
            
            try {
                await userConfig.getConfig();
                expect.fail('Should have thrown not found error');
            } catch (error) {
                expect(error.message).to.include('Configuration not found');
            }
        });

        it('should return default configuration when none exists', async () => {
            const config = await userConfig.getConfig();
            expect(config).to.deep.equal(userConfig.defaultConfig);
        });
    });
});
