import TruffleConfig from "@truffle/config";
import Resolver from "@truffle/resolver";

export interface RequireOptions {
  file: string;
  config: TruffleConfig;
}

export interface ExecOptions {
  contracts_build_directory: string;
  /**
   *  Path to file to execute. Must be a module that exports a function.
   */
  file: string;

  /**
   * Arguments passed to the exported function within file. If a callback is not
   * included in args, exported function is treated as synchronous.
   */
  args: any[];

  /**
   * Object containing any global variables you'd like set when this function is run.
   */
  context: {
    [index: string]: any;
  };
  resolver: Resolver;
  provider: Provider;
  network: string | number;
  network_id: string | number;
  networks: {
    [index: string]: {
      type: string; // likely "ethereum", but not guaranteed
    };
  };
}

interface JsonRPCRequest {
  jsonrpc: string;
  method: string;
  params: any[];
  id: number;
}

export interface JsonRPCResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: string;
}

export interface Callback<ResultType> {
  (error: Error): void;
  (error: null, val: ResultType): void;
}

export interface Provider {
  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): any;
}
