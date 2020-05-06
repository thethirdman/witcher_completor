<script>
  export let substance;
  import Component from './Component.svelte';

 // FIXME: make the colors more readable
let black = "black";
let blue = "blue";
let brown = "brown";
let green = "green";
let grey = "grey";
let red = "red";
let yellow = "yellow";

let styles = {
  "Fields":green,
  "Forests":green,
  "Mountains":grey,
  "Cities":grey,
  "Underground":black,
  "Caves":black,
  "Swamps":brown,
  "Ghouls":red,
  "Nekkers":red,
  "Rock Trolls":red,
  "Wraiths":red,
  "Drowners":red,
  "Grave Hags":red,
  "Sirens":red,
  "Noon Wraiths":red,
  "Griffins":red,
  "Griffin Nests":red,
  "Golems":red,
  "Werewolves":red,
  "Arachasae":red,
  "Endrega":red,
  "Endrega Nests":red,
  "Fiends":red,
  "Fiend Territory":red,
  "Katakans":red,
  "Wyverns":red,
  "Dogs":red,
  "Wolves":red,
  "Ocean floor":blue,
  "Shore":blue,
  "The Blue Mountains":blue,
  "Breweries":yellow
}

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
