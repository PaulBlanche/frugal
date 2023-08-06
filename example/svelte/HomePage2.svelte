<script>
	import CounterIsland from "./Counter.island.svelte";
	import Counter from "./Counter.svelte";

	export let assets;
	export let descriptor;
	console.log(assets)
	const syleHref = assets["style"]?.[descriptor];
	const scriptSrc = assets["script"]?.[descriptor];
</script>

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width" />
	<meta name="generator" content="frugal" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	{#if syleHref}
		<link rel="stylesheet" href={syleHref} />
	{/if}
	{#if scriptSrc}
		<script type="module" src={scriptSrc}></script>
	{/if}
</head>

<main>
	<a href="/">home</a>
	<CounterIsland>This is a counter</CounterIsland>
</main>

<style global>
	html {
		font-family: system-ui;
		margin: 0;
	}

	body {
		padding: 2rem;
	}

	main {
		max-width: 600px;
		margin: 0 auto;
	}

	.scroll-padder {
		padding: 200px 0 400px;
		text-align: center;
	}
</style>
