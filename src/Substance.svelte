<script>
  export let substance;
  import Component from './Component.svelte';
  import { styles } from './Locations.svelte';

</script>
<style>
  .purple-bg {
    background-color: purple;
  }
  .room-right {
    margin-right: 8px;
  }
</style>

<tr>
  <td>{substance.name}</td>
  <td><Component name="{substance.substance}"/></td>
    <td>
      {#each substance.location as l}
        {#if styles[l] != undefined }
          <span class="badge room-right" style="background-color: {styles[l]}; color: #fff;"> {l}</span>
        {:else}
          FIXME: {l}
        {/if}
      {/each}
    </td>
  <td>{substance.rarity}</td>
  <td>{substance.quantity}</td>
  <td>{substance.forage}</td>
  <td>{substance.weight}</td>
  <td>{substance.cost}</td>
</tr>
