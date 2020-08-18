import { SpawnOptions, ExecFileOptions } from "child_process";
import { ExtraSpawnOptions } from "builder-util";
import { VmManager } from "./vm";
export declare class WineVmManager extends VmManager {
    constructor();
    exec(file: string, args: Array<string>, options?: ExecFileOptions, isLogOutIfDebug?: boolean): Promise<string>;
    spawn(file: string, args: Array<string>, options?: SpawnOptions, extraOptions?: ExtraSpawnOptions): Promise<any>;
    toVmFile(file: string): string;
}
