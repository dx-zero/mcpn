import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseCliEntryArgs, main } from '../src/cli-entry';
import * as server from '../src/server.js';

// Mock the server module functions
vi.mock('../src/server.js', () => ({
  loadAndMergeConfig: vi.fn().mockReturnValue({}),
  createMcpServer: vi.fn().mockReturnValue({ id: 'mock-server' }),
  startServer: vi.fn()
}));

// Mock the utils module
vi.mock('../src/utils.js', () => ({
  getPackageInfo: vi.fn().mockReturnValue({ version: '0.0.1' })
}));

describe('CLI Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseCliEntryArgs', () => {
    it('should parse preset flag correctly', () => {
      const args = parseCliEntryArgs(['--preset', 'coding']);
      expect(args.presets).toEqual(['coding']);
      expect(args.configPath).toBeUndefined();
    });

    it('should handle comma-separated presets', () => {
      const args = parseCliEntryArgs(['--preset', 'coding,thinking']);
      expect(args.presets).toEqual(['coding', 'thinking']);
    });

    it('should parse config flag correctly', () => {
      const args = parseCliEntryArgs(['--config', './custom-config.js']);
      // Note: The actual path will be resolved, so we're just checking it's set
      expect(args.configPath).toBeDefined();
      expect(args.configPath).toContain('custom-config.js');
    });

    it('should default to thinking preset if no config or preset specified', () => {
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const args = parseCliEntryArgs([]);
      expect(args.presets).toEqual(['thinking']);
      expect(args.configPath).toBeUndefined();
      
      // Verify the warning was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'No preset or config specified, defaulting to \'thinking\' preset.'
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should not default to thinking preset if config is specified', () => {
      const args = parseCliEntryArgs(['--config', './config.js']);
      expect(args.presets).toEqual([]);
      expect(args.configPath).toBeDefined();
    });

    it('should handle short flag for config', () => {
      const args = parseCliEntryArgs(['-c', './config.js']);
      expect(args.configPath).toBeDefined();
    });
  });

  describe('main function', () => {
    it('should call server functions with correct arguments', async () => {
      const mockServer = await main(['--preset', 'coding']);
      
      // Check that the parse results were passed to loadAndMergeConfig
      expect(server.loadAndMergeConfig).toHaveBeenCalledWith(['coding'], undefined);
      
      // Check that createMcpServer was called with the config and version
      expect(server.createMcpServer).toHaveBeenCalledWith({}, '0.0.1');
      
      // Check that startServer was called with the server and parse results
      expect(server.startServer).toHaveBeenCalledWith(
        { id: 'mock-server' }, 
        ['coding'], 
        undefined
      );

      // Check that the server was returned
      expect(mockServer).toEqual({ id: 'mock-server' });
    });

    it('should handle config path argument', async () => {
      await main(['--config', './test-config.js']);
      
      // The config path should be resolved and passed to loadAndMergeConfig
      expect(server.loadAndMergeConfig).toHaveBeenCalledWith(
        [], // No presets
        expect.stringContaining('test-config.js')
      );
    });

    it('should use default thinking preset when no args provided', async () => {
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await main([]);
      
      expect(server.loadAndMergeConfig).toHaveBeenCalledWith(
        ['thinking'], 
        undefined
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
}); 