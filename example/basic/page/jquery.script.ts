if (import.meta.environment === "client") {
    // we want to use jQuery (who am i to judge ?), but the module won't load
    // server side (it needs access to the document right away). To fix this, we
    // dynamically import it inside a conditional block running only in the
    // client.
    //
    // since we target browsers that might not be able to execute top level
    // await, we wrap everything in an async iife
    (async () => {
        const { default: $ } = await import("https://code.jquery.com/jquery-3.7.0.min.js");
        console.log($("body"));
    })();
}
