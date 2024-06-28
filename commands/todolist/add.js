const { SlashCommandBuilder } = require("discord.js");
const UserListData = require("../../models/UserListData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("ey")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Pick a title for your goal.")
        .setMinLength(1)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Give a description for your goal.")
        .setMinLength(1)
        .setRequired(true)
    ),
  //TODO: Create a tag option
  async execute(interaction) {
    const title = interaction.options.getString("title");
    const desc = interaction.options.getString("description");


    let data = await UserListData.findOne({ UserID: interaction.user.id });
    if (data) {
      data.ToDos.push({
        Title: title,
        Description: desc,
        Status: false,
      });
      data.save();
      interaction.reply({content: "Done!", ephemeral : true });
    } else {
      const userList = new UserListData({
        UserID: interaction.user.id,
        ToDos : [{
          Title: title,
          Description: desc,
          Status: false,
        }]
      });
      userList.save();
      interaction.reply({content: "Done New!", ephemeral : true });
    }
  },
};
