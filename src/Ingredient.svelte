<script>
  export let ingredient;
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
  <td>{ingredient.name}</td>
    <td>
      {#each ingredient.location as l}
        {#if styles[l] != undefined }
          <span class="badge room-right" style="background-color: {styles[l]}; color: #fff;"> {l}</span>
        {:else}
          FIXME: {l}
        {/if}
      {/each}
    </td>
  <td>{ingredient.rarity}</td>
  <td>{ingredient.quantity}</td>
  <td>{ingredient.forage}</td>
  <td>{ingredient.weight}</td>
  <td>{ingredient.cost}</td>
</tr>
