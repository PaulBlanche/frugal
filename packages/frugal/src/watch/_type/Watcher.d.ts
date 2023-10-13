export type Node = {
    importCount: number;
    filePath: string;
    parsed: boolean;
    children: Record<string, boolean>;
};
