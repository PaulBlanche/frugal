<script>
	import SharedCounterIsland from "../component/SharedCounterIsland.svelte";
	import DynamicIsland from "./DynamicIsland.svelte";

	export let assets;
	const styles = assets.get('style');
	const scripts = assets.get("script");
</script>

<svelte:head>
	{#each scripts as src}
		<script type="module" src={src}></script>
	{/each}
</svelte:head>

<span>Page 2</span>
<div style="border:1px solid black;">
	<SharedCounterIsland page="page 2" />
</div>
<a href="/page1">page 1</a>
<span>scroll down ...</span>
<div style="height:1000px">
</div>
<DynamicIsland />

