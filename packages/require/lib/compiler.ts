import path from "path";
import TruffleError from "@truffle/error";

import type { CreateOptions, Service } from "ts-node";
import TruffleConfig from "@truffle/config";
import { readFileSync, existsSync } from "fs";

import originalRequire from "original-require";

import vm from "vm";

/**
 * @returns compiler function from user's installation of `ts-node` if script is
 * a ts or tsx file, otherwise `undefined`.
 */
export function compile(conf: TruffleConfig, scriptPath: string): string {
  const source = readFileSync(scriptPath, { encoding: "utf-8" });

  // we only compile TS files, so just return the source unless we are dealing
  // with one of those
  if (![".ts", ".tsx", ".cts"].includes(path.extname(scriptPath))) {
    return source;
  }

  const compilationService = _getOrCreateCompilationService(conf, scriptPath);

  return compilationService.compile(source, scriptPath);
}

export function registerTsNode(
  conf: TruffleConfig,
  scriptPath: string,
  context: Object
) {
  // we only compile TS files, so bail unless we are dealing with one of those;
  if (![".ts", ".tsx", ".cts"].includes(path.extname(scriptPath))) {
    return;
  }

  const code = `
    const tsNode = require("ts-node");
    const registrationOptions = {
      cwd: ${JSON.stringify(conf.working_directory.toString())},
      compilerOptions: {
        inlineSourceMap: true
      }
    };
    tsNode.register(registrationOptions);
    `;
  const script = new vm.Script(code);
  script.runInContext(context);
}

let _compilationService: Service | null = null;

function _getOrCreateCompilationService(
  conf: TruffleConfig,
  scriptPath: string
): Service {
  if (!_compilationService) {
    try {
      const createOptions: CreateOptions = {
        cwd: path.dirname(scriptPath),
        esm: false,
        compilerOptions: {
          inlineSourceMap: true
        }
      };

      _compilationService = originalRequire("ts-node").create(createOptions);

      const globalDeclarationsPath = existsSync(
        path.join(__dirname, "scriptGlobals.ts")
      )
        ? path.join(__dirname, "scriptGlobals.ts")
        : path.join(__dirname, "..", "scriptGlobals.ts");
      _compilationService!.compile(
        readFileSync(globalDeclarationsPath, { encoding: "utf-8" }),
        globalDeclarationsPath
      );
    } catch (err) {
      if (err.code === "MODULE_NOT_FOUND") {
        throw new TruffleError(`Attempted to execute script with extension
          ${path.extname(
            scriptPath
          )}, but the 'ts-node' module, or one of its required peers
          has not been installed.`);
      } else {
        throw err;
      }
    }
  }
  return _compilationService!;
}
