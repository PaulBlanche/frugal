import $ from "https://code.jquery.com/jquery-3.7.0.min.js";

if (import.meta.main) {
    window.$ = $;
    console.log($("body"));
}
