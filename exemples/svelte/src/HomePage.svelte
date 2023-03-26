<script>
    export let assets;
    export let descriptor;
    const syleHref = assets["style"][descriptor];
</script>

<head>
    <title>home</title>
    {#if syleHref}
        <link rel="stylesheet" href={syleHref} />
    {/if}
</head>

<div class="red">
    <h1>home</h1>
    <a href="/counter">counter</a>
</div>

<style>
    .red {
        color: red;
    }
</style>
