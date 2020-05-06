<script>
  import Component from './Component.svelte';

export let obj;
</script>
<style>
  .top {
    margin-top: 20px;
  }
  .content {
    margin-top: 10px;
  }
</style>
<div class="card top">
  <div class="card-body">
    <div class="row">
      <div class="col">
        <h4> {obj.name} </h4>
      </div>
      <hr/>
      <div class="col-sm">
        <div class="row">
          <div class="col-3">
            Avail: {obj.avail}
          </div>
          <div class="col-5">
            Weight: {obj.weight}
          </div>
          <div class="col-3">
            Cost: {obj.cost}
          </div>
        </div>
      </div>
    </div>
    {#if obj.alchemy_dc}
      <div class="row">
        <div class="col">
          Alchemy DC: {obj.alchemy_dc}
        </div>
        <div class="col">
          Time: {obj.time}
        </div>
        {#if obj.components}
          <div class="col-sm">
            {#each obj.components as c}
              <Component name="{c}"/>
            {/each}
          </div>
        {/if}
        <div class="col">
          Formula cost: {obj.craft_cost}
        </div>
      </div>
    {/if}
    <div class="row content">
      <div class="col">
        {obj.effect}
      </div>
    </div>
  </div>
</div>
