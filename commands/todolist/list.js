const { SlashCommandBuilder } = require('discord.js');
const UserListData = require("../../models/UserListData");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('List your goals.'),
	async execute(interaction) {
		let data = await UserListData.findOne({ UserID: interaction.user.id });
		if(data) {
			let response = "";
			let count = 1;
			data.ToDos.forEach(element => {
				let str = count.toString() + " Title: " + element.Title + " Description: " + element.Description + " " + (element.Status ? '✅' : '❌') + `\n`;
				response += str;
				count++;
				console.log(element._id.toString());
			});
			interaction.reply({content: response, ephemeral: true});
		}
		else{
			interaction.reply({content: "There are no goals to list.", ephemeral: true});
		}
	},
};
