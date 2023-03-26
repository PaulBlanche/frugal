<script>
    import CounterIsland from "./Counter.island.svelte";
    import "./session.script.ts";

    export let assets;
    export let descriptor;
    const scriptSrc = assets["script"][descriptor];
</script>

<head>
    <title>counter</title>
    {#if scriptSrc}
        <script type="module" src={scriptSrc}></script>
    {/if}
</head>

<div>
    <h1>counter</h1>

    <CounterIsland title="counter" />

    <a href="/">home</a>
</div>
