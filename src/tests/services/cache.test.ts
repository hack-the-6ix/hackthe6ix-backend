import DynamicCacheProvider from "../../services/cache";

const TEST_KEY = 'test';

describe('Dynamic cache', () => {
    test('Get item not in cache', async () => {
        let called = 0;
        const dynamicCache = new DynamicCacheProvider((key) => {
            ++called;
            return key;
        });

        const result = await dynamicCache.get(TEST_KEY);
        expect(result).toBe(TEST_KEY);
        expect(called).toBe(1);
    });

    test('Get item in cache loaded implicitly', async () => {
        let called = 0;
        const dynamicCache = new DynamicCacheProvider((key) => {
            ++called;
            return key;
        });

        const result = await dynamicCache.get(TEST_KEY);
        const result2 = await dynamicCache.get(TEST_KEY);
        expect(result).toBe(TEST_KEY);
        expect(result2).toBe(TEST_KEY);
        expect(called).toBe(1);
    });

    test('Get item in cache loaded explicitly', async () => {
        let called = 0;
        const dynamicCache = new DynamicCacheProvider((key) => {
            ++called;
            return key;
        });

        dynamicCache.set(TEST_KEY, TEST_KEY);

        const result = await dynamicCache.get(TEST_KEY);

        expect(result).toBe(TEST_KEY);
        expect(called).toBe(0);
    });
})