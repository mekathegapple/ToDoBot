const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputStyle,
  TextInputBuilder,
  time,
} = require("discord.js");
const UserListData = require("../../models/UserListData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("List your goals."),
  async execute(interaction) {
    let data = await UserListData.findOne({ UserID: interaction.user.id });
    if (data) {
      let options = [];
      let response = "";
      let count = 1;
      data.ToDos.forEach((element) => {
        let str =
          "Goal #" +
          count.toString() +
          " - **Title:** " +
          element.Title +
          "| **Description:** " +
          element.Description +
          "  " +
          (element.Status ? "✅" : "❌") +
          `\n`;
        response += str;
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(count + " - " + element.Title)
            .setDescription(element.Description)
            .setValue(element._id.toString())
        );
        count++;
      });
      const edit = new ButtonBuilder()
        .setCustomId("edit")
        .setLabel("Edit a Goal")
        .setStyle(ButtonStyle.Primary);

      const remove = new ButtonBuilder()
        .setCustomId("remove")
        .setLabel("Remove a Goal")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents([edit, remove]);

      const reply = await interaction.reply({
        content: response,
        ephemeral: true,
        components: [row],
      });

      const buttonCollector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 900_000,
      });

      buttonCollector.on("collect", async (i) => {
        if (i.customId == "edit") {
          const list = new StringSelectMenuBuilder()
            .setCustomId("todolistmenu")
            .setPlaceholder("Pick a Goal")
            .addOptions(options);

          const listRow = new ActionRowBuilder().addComponents(list);

          const update = await i.update({
            //TODO: Add a return button maybe
            content: response,
            ephemeral: true,
            components: [listRow],
          });

          const listCollector = update.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 90_000,
          });

          listCollector.on("collect", async (j) => {
            if (j.customId == "todolistmenu") {
              let goal = data.ToDos.id(j.values[0]);

              const modal = new ModalBuilder()
                .setCustomId("todoModal")
                .setTitle("Edit a Goal");

              const TitleInput = new TextInputBuilder()
                .setCustomId("todotitle")
                .setLabel("Title")
                .setValue(goal.Title)
                .setStyle(TextInputStyle.Short);

              const DescriptionInput = new TextInputBuilder()
                .setCustomId("tododesc")
                .setLabel("Description")
                .setValue(goal.Description)
                .setStyle(TextInputStyle.Paragraph);

              const firstActionRow = new ActionRowBuilder().addComponents(
                TitleInput
              );
              const secondActionRow = new ActionRowBuilder().addComponents(
                DescriptionInput
              );
              modal.addComponents(firstActionRow, secondActionRow);

              await j.showModal(modal);
              const filter = (interaction) =>
                interaction.customId === "todoModal";
              j.awaitModalSubmit({ time: 60_000, filter })
                .then((result) => {
                  result.deferReply();
                  const newTitle = result.fields.getTextInputValue("todotitle");
                  const newDesc = result.fields.getTextInputValue("tododesc");
                  goal.Title = newTitle;
                  goal.Description = newDesc;
                  data.save();
                  result.deleteReply();
                  i.editReply({
                    content: "Successfully edited the goal.",
                    ephemeral: true,
                    components: [],
                  });
                })
                .catch((err) => {
                  console.error(err);
                });
            }
          });
        }
        if (i.customId == "remove") {
          const list = new StringSelectMenuBuilder()
            .setCustomId("todolistmenu")
            .setPlaceholder("Pick a Goal")
            .addOptions(options);

          const listRow = new ActionRowBuilder().addComponents(list);

          const update = await i.update({
            //TODO: Add a return button maybe
            content: response,
            ephemeral: true,
            components: [listRow],
          });

          const listCollector = update.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 90_000,
          });

          listCollector.on("collect", async (j) => {
            if (j.customId == "todolistmenu") {
              let goal = data.ToDos.id(j.values[0]);

              const yesButton = new ButtonBuilder()
                .setCustomId("yes")
                .setLabel("Yes!")
                .setStyle(ButtonStyle.Danger);

              const noButton = new ButtonBuilder()
                .setCustomId("no")
                .setLabel("No!")
                .setStyle(ButtonStyle.Secondary);

              const buttonRow = new ActionRowBuilder().addComponents([
                yesButton,
                noButton
              ]);
              const update = await j.update({content: `Confirm that you want to remove ${goal.Title} goal from your list.`, ephemeral: true, components: [buttonRow]});

              const confirmCollector = update.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 90_000
              })

              confirmCollector.on("collect", async (k) => {
                if(k.customId = "yes") {
                  goal.deleteOne();
                  data.save();
                  k.update({content: "done", ephemeral: true, components: []});
                }
                else if(k.customId = "no") {
                  k.update({content: "not done", ephemeral: true, components: []});
                }
              });
            }
          });
        }
      });
    } else {
      interaction.reply({
        content: "There are no goals to list.",
        ephemeral: true,
      });
    }
  },
};
