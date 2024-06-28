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
  EmbedBuilder,
} = require("discord.js");
const UserListData = require("../../models/UserListData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("List your goals."),
  async execute(interaction) {
    let data = await UserListData.findOne({ UserID: interaction.user.id });
    if (data) {
      let embed = new EmbedBuilder()
        .setColor("#30D5C8")
        .setTitle("Your To Do List")
        .setTimestamp()
        .setFooter({ text: "Made with ❤️ by The Gapple" });

      let options = [];
      let count = 1;
      data.ToDos.forEach((element) => {
        embed.addFields({
          name: `${count.toString()}-${element.Title}    ${
            element.Status ? "✅" : "❌"
          }`,
          value: element.Description + `\n`,
        });
        options.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(count + " - " + element.Title)
            .setDescription(element.Description)
            .setValue(element._id.toString())
        );
        count++;
      });

      const list = new StringSelectMenuBuilder()
        .setCustomId("todolistmenu")
        .setPlaceholder("Pick a Goal")
        .addOptions(options);

      const listRow = new ActionRowBuilder().addComponents(list);

      const reply = await interaction.reply({
        content: " ",
        embeds: [embed],
        ephemeral: true,
        components: [listRow],
      });

      const listCollector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 900_000,
      });

      listCollector.on("collect", async (i) => {
        if (i.customId == "todolistmenu") {
          const goal = data.ToDos.id(i.values[0]);
          const index = data.ToDos.indexOf(goal) + 1;

          const embed = new EmbedBuilder()
            .setTitle(`${index}-${goal.Title}`)
            .setDescription(
              goal.Description + `\n\nStatus: ${goal.Status ? "✅" : "❌"}`
            )
            .addFields({
              name: "Time of Creation: ",
              value: "wip",
              inline: true,
            })
            .setColor("#30D5C8")
            .setTimestamp()
            .setFooter({ text: "Made with ❤️ by The Gapple" });

          const complete = new ButtonBuilder()
            .setCustomId("complete")
            .setLabel("Complete")
            .setStyle(ButtonStyle.Success);

          const edit = new ButtonBuilder()
            .setCustomId("edit")
            .setLabel("Edit")
            .setStyle(ButtonStyle.Primary);

          const remove = new ButtonBuilder()
            .setCustomId("remove")
            .setLabel("Remove")
            .setStyle(ButtonStyle.Danger);

          const buttonRow = new ActionRowBuilder().addComponents([
            complete,
            edit,
            remove,
          ]);
          const buttonReply = await i.reply({
            content: " ",
            embeds: [embed],
            components: [buttonRow],
            ephemeral: true,
          });

          const buttonCollector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
          });
          buttonCollector.on("collect", async (j) => {
            if (j.customId == "complete") {
              goal.Status = true;
              data.save();

              const editedEmbed = new EmbedBuilder()
              .setTitle(`${index}-${goal.Title}`)
              .setDescription(
                goal.Description + `\n\nStatus: ${goal.Status ? "✅" : "❌"}`
              )
              .addFields({
                name: "Time of Creation: ",
                value: "wip",
                inline: true,
              })
              .setColor("#30D5C8")
              .setTimestamp()
              .setFooter({ text: "Made with ❤️ by The Gapple" });
              await i.editReply({embeds: [editedEmbed]})
              return j.reply("You've completed this goal. Congrats!")
            }
            if (j.customId == "edit") {
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
                  j.editReply({
                    content: "Successfully edited the goal.",
                    ephemeral: true,
                    embeds: [],
                    components: [],
                  });
                })
                .catch((err) => {
                  console.error(err);
                });
            }
            if (j.customId == "remove") {
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
                noButton,
              ]);
              const update = await j.update({
                content: `Confirm that you want to remove this goal from your list.`,
                ephemeral: true,
                components: [buttonRow],
              });

              const confirmCollector = update.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 90_000,
              });

              confirmCollector.on("collect", async (k) => {
                if ((k.customId = "yes")) {
                  goal.deleteOne();
                  data.save();
                  k.update({
                    content: "done",
                    ephemeral: true,
                    components: [],
                    embeds: [],
                  });
                } else if ((k.customId = "no")) {
                  k.update({
                    content: "not done",
                    ephemeral: true,
                    components: [],
                    embeds: [],
                  });
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
