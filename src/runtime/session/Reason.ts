export enum Reason {
    NON_OK_RESPONSE,
    NAVIGATION_DISABLED_ON_TARGET,
    NAVIGATION_DISABLED_ON_ELEMENT,
    EXTERNAL_TARGET,
    DIALOG_FORM,
}

export type NavigationResult = { success: false; reason: Reason } | { success: true };
