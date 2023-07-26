declare global {
    type FrugalReadyStateChangeEvent = CustomEvent<{ readystate: DocumentReadyState }>;

    type FrugalBeforeUnloadEvent = CustomEvent<never>;

    type FrugalBeforeVisit = CustomEvent<never>;

    interface WindowEventMap {
        "frugal:readystatechange": FrugalReadyStateChangeEvent;
        "frugal:beforeunload": FrugalBeforeUnloadEvent;
        "frugal:beforevisit": FrugalBeforeVisit;
    }
}
