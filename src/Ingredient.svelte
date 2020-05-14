<script>
  export let ingredient;

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
