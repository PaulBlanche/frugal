export type ClassName =
    | { type: "dependency"; importIdentifier: string; name: string }
    | { type: "local"; name: string; names: ClassName[] }
    | {
          type: "global";
          name: string;
      };
