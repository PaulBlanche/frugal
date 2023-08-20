<script>
	import CounterIsland from "./Counter.island.svelte";
	import Counter from "./Counter.svelte";

	export let assets;
	const styles = assets.get('style');
	const scripts = assets.get("script");
</script>

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width" />
	<meta name="generator" content="frugal" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	{#each styles as href}
		<link rel="stylesheet" href={href} />
	{/each}
	{#each scripts as src}
		<script type="module" src={src}></script>
	{/each}
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
