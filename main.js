// take slack text and translate to a Notion item
import he from "he";

import fs from "fs";

let rawdata = fs.readFileSync("./slack_emoticons_to_html_unicode.json");
let emojis = JSON.parse(rawdata);

const slackNotionId = {
  UT9G67J1Z: "f2ca3fc5-9ca1-46ed-be8b-fb618c56558a",
  U0185FAF1T5: "6718f0c7-f6e3-4c3a-9f65-e8344806b5b6",
  U025P5K0S0Z: "6f7ce62c-fa2e-4440-8805-72af5f937666",
  U021UR4DW5C: "8fd7689c-d795-4ae9-aa53-5846ac1569b7",
  U0224KFNYRW: "7c02e0ba-2aec-4696-a91d-ecaa01b616ce",
  U025J9SLXV3: "94f6b8b7-e8b0-4790-8265-f08e6b1d550c",
  UT9G67YFM: "6c3a6ec1-4b99-4e5c-8214-cea14fd9b142",
};

const replaceEmojis = (string) => {
  var splitString = string.split(" ");
  splitString.forEach((word) => {
    for (var key in emojis) {
      if (word.search(":" + key + ":") != -1) {
        var regexKey = new RegExp(key, "gi");
        string = string.replace(regexKey, he.decode(emojis[key]));
      }
    }
  });
  string = string.replace(/:/gi, "")
  return string;
};

const newLinkItem = (plainText, link) => {
  var array = {
    type: "text",
    text: {
      content: plainText,
      link: {
        type: "url",
        url: link,
      },
    },
  };
  return array;
};

const newTextItem = (text) => {
  var array = {
    type: "text",
    text: {
      content: text,
    },
  };
  return array;
};

const newUserItem = (slackUserID, idDatabase) => {
  var array = {
    type: "mention",
    mention: {
      type: "user",
      user: { id: idDatabase[slackUserID] },
    },
  };
  return array;
};

const newCodeItem = (codeText) => {
  var array = {
    type: "text",
    text: {
      content: codeText,
    },
    annotations: {
      code: true,
    },
  };
  return array;
};

const newChild = (splitItem) => {
  var notionAppendItem = [];

  splitItem.forEach((item) => {
    if (item.search("http") != -1) {
      item = item.replace("\n", "");
      let linkSplit = item.split("|");

      const notionLinkItem = newLinkItem(linkSplit[1], linkSplit[0]);
      notionAppendItem.push(notionLinkItem);
    } else if (item.search(":") != -1) {
      item = item.replace("\n", "");
      var string = replaceEmojis(item);
      const textItem = newTextItem(string);
      notionAppendItem.push(textItem);
    } else if (item.search("@") != -1) {
      item = item.replace("\n", "");
      var string = item.replace("@", "");
      const userItem = newUserItem(string, slackNotionId);
      notionAppendItem.push(userItem);
    } else if (item.search("`") != -1) {
      item = item.replace("\n", "");
      var splitString = item.split("`");
      const textItem = newTextItem(splitString[0]);
      notionAppendItem.push(textItem);
      const codeItem = newCodeItem(splitString[1]);
      notionAppendItem.push(codeItem);
    } else {
      item = item.replace("\n", "");
      const textItem = newTextItem(item);
      notionAppendItem.push(textItem);
    }
  });
  return notionAppendItem;
};

const slackExample =
  "Here is a message with <https://victoriaslocum.com|links> and\n" +
  "\n" +
  "line breaks :slightly_smiling_face: :potato: :shrimp:  emojis\n" +
  "\n" +
  "tags like hey <@U0185FAF1T5> and even `code`";

const newNotionItem = (slackMessage, userId) => {
  var newLineSplit = slackMessage.split("\n");
  newLineSplit = newLineSplit.filter(Boolean);

  const emptyBlock = {
    object: "block",
    type: "paragraph",
    paragraph: {
      text: [
        {
          type: "text",
          text: {
            content: "",
          },
        },
      ],
    },
  }

  const notionItem = [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        text: [
          {
            type: "mention",
            mention: {
              type: "user",
              user: { id: slackNotionId[userId] },
            },
          },
          {
            type: "text",
            text: {
              content: " says:",
            },
          },
        ],
      },
    },
  ];

  newLineSplit.forEach((line) => {
    var regex = new RegExp(/[\<\>]/);

    var split = line.split(regex);

    var item = newChild(split);

    console.log(item);

    const childItem = {
      object: "block",
      type: "paragraph",
      paragraph: { text: item },
    };

    notionItem.push(childItem);
  });

  notionItem.push(emptyBlock);

  console.log(notionItem);
  return notionItem;
};

newNotionItem(slackExample, "UT9G67J1Z");
