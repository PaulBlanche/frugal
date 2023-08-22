<script>
	import SharedCounterIsland from "../component/SharedCounterIsland.svelte";

	export let assets;
	const styles = assets.get('style');
	const scripts = assets.get("script");
</script>

<svelte:head>
	{#each scripts as src}
		<script type="module" src={src}></script>
	{/each}
</svelte:head>

<span>Page 1</span>
<div style="border:1px solid black;">
	<SharedCounterIsland page="page 1" />
</div>
<a href="/page2">page 2</a>

