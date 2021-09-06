// take slack text and translate to a Notion item

// Slack user ID to Notion user ID dictionary
const slackNotionId = {
  UT9G67J1Z: "f2ca3fc5-9ca1-46ed-be8b-fb618c56558a",
  U0185FAF1T5: "6718f0c7-f6e3-4c3a-9f65-e8344806b5b6",
  U025P5K0S0Z: "6f7ce62c-fa2e-4440-8805-72af5f937666",
  U021UR4DW5C: "8fd7689c-d795-4ae9-aa53-5846ac1569b7",
  U0224KFNYRW: "7c02e0ba-2aec-4696-a91d-ecaa01b616ce",
  U025J9SLXV3: "94f6b8b7-e8b0-4790-8265-f08e6b1d550c",
  UT9G67YFM: "6c3a6ec1-4b99-4e5c-8214-cea14fd9b142",
};

// example message from Slack
const slackExample =
  "made some major edits to our integration :tada:\n" +
  "Tags: Team\n" +
  "\n" +
  "I worked on the standup integration a lot today and was able to get increased capability for `code`, emojis :wave: :potato: :shrimp: , and <http://endless.horse/|links>, along with adding features to the title such as more ways for cutting off, as well as links and emojis too.\n" +
  "\n" +
  "Things still to do are:\n" +
  "• test if bullet points, *bold,* and _italic_ work or not\n" +
  "• write blog posts\n" +
  "• add file capabilities\n" +
  "• add a profile pic for our app (any ideas?)\n" +
  "• make sure everything works :grimacing:\n";

// for emojis
import he from "he";
import fs from "fs";

// import slack to html emoji dictionary
let rawdata = fs.readFileSync("./slack_emoticons_to_html_unicode.json");
let emojis = JSON.parse(rawdata);

// following functions are for converting Slack to Notion Item
// replace the emojis codes (from Slack) in the text with actual emojis
const replaceEmojis = (string) => {
  // split string based on words
  var splitString = string.split(" ");

  // for each word in the string:
  // see if the word has the emoji marker ":"
  // search keys in the emoji for the word
  // replace the word with the decoded html value
  splitString.forEach((word) => {
    if (word.search(":") != -1) {
      for (var key in emojis) {
        if (word.search(":" + key + ":") != -1) {
          var regexKey = new RegExp(key);
          string = string.replace(regexKey, he.decode(emojis[key]));

          // replace all the ":" in the string and return
          string = string.replace(/:/gi, "");
        }
      }
    }
  });

  return string;
};

// create a new Notion block item for links
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

// create a new Notion block item for text
const newTextItem = (text) => {
  var array = {
    type: "text",
    text: {
      content: text,
    },
  };
  return array;
};

// create a new Notion block item for users
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

// create a new Notion block item for code
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

// create a new Notion block item for bold text
const newBoldItem = (codeText) => {
  var array = {
    type: "text",
    text: {
      content: codeText,
    },
    annotations: {
      bold: true,
    },
  };
  return array;
};

// create a new Notion block item for code text
const newItalicItem = (codeText) => {
  var array = {
    type: "text",
    text: {
      content: codeText,
    },
    annotations: {
      italic: true,
    },
  };
  return array;
};

// create a new Notion block item for strikethrough text
const newStrikeItem = (codeText) => {
  var array = {
    type: "text",
    text: {
      content: codeText,
    },
    annotations: {
      strikethrough: true,
    },
  };
  return array;
};

// create a new child of a page with different blocks
const newChild = (splitItem) => {
  // create the Item
  var notionItem = [];

  // the input is a split item based on (/[\<\>]/), and then for each item
  // both links and users are indicated by <text>
  splitItem.forEach((item) => {
    if ((item.search(/https?/) != -1) | (item.search(/mailto/) != -1)) {
      // see if its a link item by searching for link text indicators

      // split link into text and link
      let linkSplit = item.split("|");

      // create link item and push to notionItem
      const linkItem = newLinkItem(linkSplit[1], linkSplit[0]);
      notionItem.push(linkItem);
    } else if (item.search("@") != -1) {
      // see if it is a user by searching for the @ symbol

      // replace indicator symbol
      var string = item.replace("@", "");

      // create a new user item and push to notionItem
      const userItem = newUserItem(string, slackNotionId);
      notionItem.push(userItem);
    } else if (item.search(/[\`\_\*\~]/) != -1) {
      // if a string contains any special annotations (bold, italic, code, strikethrough)

      // replace any emojis in string
      item = replaceEmojis(item);

      // kinda wack, but replace all the symbols with = on either end
      // so it can break without getting rid of the original symbol
      item = item.replace(/[\*](?=[a-zA-Z0-9])/, "=*");
      item = item.replace(/(?<=[a-zA-Z0-9,])[\*]/, "*=");
      item = item.replace(/[\`](?=[a-zA-Z0-9])/, "=`");
      item = item.replace(/(?<=[a-zA-Z0-9,])[\``]/, "`=");
      item = item.replace(/[\_](?=[a-zA-Z0-9])/, "=_");
      item = item.replace(/(?<=[a-zA-Z0-9,])[\_]/, "_=");
      item = item.replace(/[\~](?=[a-zA-Z0-9])/, "=~");
      item = item.replace(/(?<=[a-zA-Z0-9,])[\~]/, "~=");

      // split item based off of =
      var split = item.split(/(\=)/gi);

      // filter out any remaining "="
      split = split.filter((test) => test.search("=") != 0);

      // for each item, check to see what type it is, replace the indicator, and push to notionItem
      split.forEach((split) => {
        if (split.search("`") != -1) {
          split = split.replace(/\`/gi, "");
          const item = newCodeItem(split);
          notionItem.push(item);
        } else if (split.search("_") != -1) {
          split = split.replace(/\_/gi, "");
          const item = newItalicItem(split);
          notionItem.push(item);
        } else if (split.search(/[\*]/) != -1) {
          split = split.replace(/\*/gi, "");
          const item = newBoldItem(split);
          notionItem.push(item);
        } else if (split.search("~") != -1) {
          split = split.replace(/\~/gi, "");
          const item = newStrikeItem(split);
          notionItem.push(item);
        } else {
          const textItem = newTextItem(split);
          notionItem.push(textItem);
        }
      });
    } else {
      // if the string is normal, then replace emojis and push text item
      var string = replaceEmojis(item);
      const textItem = newTextItem(string);
      notionItem.push(textItem);
    }
  });
  console.log(notionItem);
  return notionItem;
};

// create a new Notion item
const newNotionItem = (slackMessage) => {
  // empty block for spacing
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
  };

  // notion Item for replies
  const notionItem = [];

  // split message on line breaks and filter empty lines
  var newLineSplit = slackMessage.split("\n");
  newLineSplit = newLineSplit.filter(Boolean);

  // for each line in Slack message
  newLineSplit.forEach((line) => {
    // split line based on link/user indicators
    var regex = new RegExp(/[\<\>]/);
    var split = line.split(regex);

    // create new child item content
    var item = newChild(split);
    // add child item content to formatted block
    const childItem = {
      object: "block",
      type: "paragraph",
      paragraph: { text: item },
    };

    // push child to notionItem
    notionItem.push(childItem);
  });

  // add an empty block for spacing and return
  notionItem.push(emptyBlock);
  console.log(notionItem);
  return notionItem;
};

newNotionItem(slackExample);
