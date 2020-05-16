<script>
  export let craftingRecipe;
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
  <td>{craftingRecipe.name}</td>
  <td>{craftingRecipe.dc}</td>
  <td>{craftingRecipe.time}</td>
  <td>{craftingRecipe.components}</td>
  <td>{craftingRecipe.investment}</td>
  <td>{craftingRecipe.cost}</td>
</tr>
