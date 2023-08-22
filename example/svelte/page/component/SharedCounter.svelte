<script>
    import { getData } from "../../../../runtime/svelte.client.ts";
    import { countWritable } from "./store.ts";
	import { onMount } from 'svelte';

    export let page;

    let date = new Date(0)
    onMount(() => {
        date = new Date()
    })

    function increment() {
        countWritable.update((count) => count + 1);
    }

    let count;
    countWritable.subscribe((value) => {
        count = value;
    });
</script>

<div>Shared island (on {page})</div>
<div>date: {date.toString()} (internal state, cleared on reload)</div>
<div>count: {count} (shared store)</div>
<button on:click={increment}>increment</button>

