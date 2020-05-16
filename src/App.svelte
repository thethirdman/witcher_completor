<script>
  import Card from './Card.svelte';
  import Substance from './Substance.svelte';
  import Ingredient from './Ingredient.svelte';
  import CraftingRecipe from './CraftingRecipe.svelte';

  import alchemicalItems from './AlchemicalItems.json';
  import alchemicalSubstances from './AlchemicalSubstances.json';
  import craftingIngredients from './CraftingIngredients.json';
  import diagrams from './Diagrams.json';

  let search="";

  // Return true if any of the fields match the data
  function itemMatch( match, item ) {
    let m = match.toLowerCase();
    for (let [key, value] of Object.entries(item)) {
      if ( typeof(value) == 'string' && value.toLowerCase().includes(m) ) {
        return true;
      } else if ( Array.isArray( value ) && value.some(elt => elt.toLowerCase().includes(m)) ) {
        return true;
      }
    }
    return false;
  }

  function filterItems( filterVal, alchemicalItems ) {
    return alchemicalItems.filter(item => itemMatch( filterVal, item) );
  }

let pages = [
  ["alchemicalItems","Alchemical Items"],
  ["alchemicalSubstances","Alchemical Substances"],
  ["craftingIngredients","Crafting Ingredients"],
  ["craftingRecipes","Crafting Diagrams"],
];
let activePage = "alchemicalItems";
</script>

 <svelte:head>
   <!--Bootstrap.css-->
 <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
 integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"crossorigin="anonymous">

 <!--fontawesome.js-->
 <script defer src="https://use.fontawesome.com/releases/v5.0.6/js/all.js"></script>

 <!-- Wolf emoji ! -->
 <link rel="icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/microsoft/209/wolf-face_1f43a.png">

 <title>Witcher completor</title>


</svelte:head>

<style>
  .top-room {
    padding-top:15px;
  }
</style>

<div class="container">
  <div class="row">
    <div class="col-1">
      Search:
    </div>
    <div class="col">
      <input bind:value={search} on:focus={() => search = ""} class="form-control"/>
    </div>
  </div>
  <div class="row top-room">
    <div class="col">
      <ul class="nav nav-tabs">
        {#each pages as page }
        <li class="nav-item">
          {#if activePage == page[0]}
            <a class="nav-link active" href="#" on:click={() => activePage=page[0]}> {page[1]}</a>
          {:else}
            <a class="nav-link" href="#" on:click={() => activePage=page[0]}> {page[1]}</a>
          {/if}
        </li>
        {/each}
      </ul>
    </div>
  </div>
  {#if activePage == "alchemicalItems" }
    <div class="row">
      <div class="col">
        {#each filterItems( search, alchemicalItems) as obj}
          <Card obj={obj}/>
        {/each}
      </div>
    </div>
  {:else if activePage == "alchemicalSubstances"}
    <div class="row">
      <div class="col">
        <table class="table table-sm">
          <tr>
            <th>Name</th>
            <th>Component</th>
            <th>Location</th>
            <th>Rarity</th>
            <th>Quantity</th>
            <th>Forage DC</th>
            <th>Weight</th>
            <th>Cost</th>
          </tr>
        {#each filterItems( search, alchemicalSubstances ) as substance}
          <Substance substance={substance}/>
        {/each}
        </table>
      </div>
    </div>
  {:else if activePage == "craftingIngredients"}
    <div class="row">
      <div class="col">
        <table class="table table-sm">
          <tr>
            <th>Name</th>
            <th>Rarity</th>
            <th>Location</th>
            <th>Quantity</th>
            <th>Forage DC</th>
            <th>Weight</th>
            <th>Cost</th>
          </tr>
        {#each filterItems( search, craftingIngredients ) as ingredient}
          <Ingredient ingredient={ingredient}/>
        {/each}
        </table>
      </div>
    </div>
  {:else if activePage == "craftingRecipes"}
    <div class="row">
      <div class="col">
        <table class="table table-sm">
          <tr>
            <th>Name</th>
            <th>Crafting DC</th>
            <th>Time</th>
            <th>Components</th>
            <th>Investment</th>
            <th>Cost</th>
          </tr>
        {#each filterItems( search, diagrams ) as diagram}
          <CraftingRecipe craftingRecipe={diagram}/>
        {/each}
        </table>
      </div>
    </div>
  {/if}
</div>
