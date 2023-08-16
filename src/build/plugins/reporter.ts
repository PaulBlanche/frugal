import * as esbuild from "../../../dep/esbuild.ts";
import { FrugalConfig } from "../../Config.ts";

import { log } from "../../log.ts";

export function reporter(config: FrugalConfig): esbuild.Plugin {
    let firstBuild = true;
    return {
        name: "__frugal_internal:reporter",
        setup(build) {
            build.onStart(() => {
                if (!firstBuild) {
                    log("Rebuild triggered", { level: "info", scope: "esbuild" });
                }
                firstBuild = false;

                config.budget.reset();
            });

            build.onEnd(async (result) => {
                const errors = result.errors;
                const warnings = result.warnings;

                for (const error of errors) {
                    const formatted = (await esbuild.formatMessages([
                        error,
                    ], {
                        kind: "error",
                        color: true,
                        terminalWidth: 100,
                    })).join("\n");

                    log("error during build", {
                        level: "error",
                        scope: "esbuild",
                        extra: formatted,
                    });
                }

                for (const warning of warnings) {
                    const formatted = (await esbuild.formatMessages([
                        warning,
                    ], {
                        kind: "warning",
                        color: true,
                        terminalWidth: 100,
                    })).join("\n");

                    log("warning during build", {
                        level: "warning",
                        scope: "esbuild",
                        extra: formatted,
                    });
                }

                config.budget.check();
            });
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS93aGl0ZXNob3VsZGVycy9wZXJzby9mcnVnYWwvc3JjL2J1aWxkL3BsdWdpbnMvcmVwb3J0ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZXNidWlsZCBmcm9tIFwiLi4vLi4vLi4vZGVwL2VzYnVpbGQudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi8uLi9sb2cudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlcG9ydGVyKCk6IGVzYnVpbGQuUGx1Z2luIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBcImVzYnVpbGQ6cmVwb3J0ZXJcIixcbiAgICAgICAgc2V0dXAoYnVpbGQpIHtcbiAgICAgICAgICAgIGJ1aWxkLm9uRW5kKGFzeW5jIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvcnMgPSByZXN1bHQuZXJyb3JzO1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhcm5pbmdzID0gcmVzdWx0Lndhcm5pbmdzO1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiBlcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkID0gKGF3YWl0IGVzYnVpbGQuZm9ybWF0TWVzc2FnZXMoW2Vycm9yXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogXCJlcnJvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hbFdpZHRoOiAxMDAsXG4gICAgICAgICAgICAgICAgICAgIH0pKS5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxvZyhcImVycm9yIGR1cmluZyBidWlsZFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbDogXCJlcnJvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGU6IFwiZXNidWlsZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmE6IGZvcm1hdHRlZCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHdhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZCA9IChhd2FpdCBlc2J1aWxkLmZvcm1hdE1lc3NhZ2VzKFt3YXJuaW5nXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogXCJ3YXJuaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1pbmFsV2lkdGg6IDEwMCxcbiAgICAgICAgICAgICAgICAgICAgfSkpLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgbG9nKFwid2FybmluZyBkdXJpbmcgYnVpbGRcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IFwid2FybmluZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGU6IFwiZXNidWlsZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmE6IGZvcm1hdHRlZCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLGFBQWEsMEJBQTBCO0FBQ25ELFNBQVMsR0FBRyxRQUFRLGVBQWU7QUFFbkMsT0FBTyxTQUFTO0lBQ1osT0FBTztRQUNILE1BQU07UUFDTixPQUFNLEtBQUs7WUFDUCxNQUFNLE1BQU0sT0FBTztnQkFDZixNQUFNLFNBQVMsT0FBTztnQkFDdEIsTUFBTSxXQUFXLE9BQU87Z0JBRXhCLEtBQUssTUFBTSxTQUFTLE9BQVE7b0JBQ3hCLE1BQU0sWUFBWSxDQUFDLE1BQU0sUUFBUSxlQUFlO3dCQUFDO3FCQUFNLEVBQUU7d0JBQ3JELE1BQU07d0JBQ04sT0FBTzt3QkFDUCxlQUFlO29CQUNuQixFQUFFLEVBQUUsS0FBSztvQkFFVCxJQUFJLHNCQUFzQjt3QkFDdEIsT0FBTzt3QkFDUCxPQUFPO3dCQUNQLE9BQU87b0JBQ1g7Z0JBQ0o7Z0JBRUEsS0FBSyxNQUFNLFdBQVcsU0FBVTtvQkFDNUIsTUFBTSxZQUFZLENBQUMsTUFBTSxRQUFRLGVBQWU7d0JBQUM7cUJBQVEsRUFBRTt3QkFDdkQsTUFBTTt3QkFDTixPQUFPO3dCQUNQLGVBQWU7b0JBQ25CLEVBQUUsRUFBRSxLQUFLO29CQUVULElBQUksd0JBQXdCO3dCQUN4QixPQUFPO3dCQUNQLE9BQU87d0JBQ1AsT0FBTztvQkFDWDtnQkFDSjtZQUNKO1FBQ0o7SUFDSjtBQUNKIn0=
