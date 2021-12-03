const axios = require("axios").default;
const fs = require("fs");

const HOST = "<REPLACE_RAPIDAPI_HOST>";
const API_KEY = "<REPLACE_RAPIDAPI_KEY>";

const WHO_TO_FETCH = process.argv[2];
const CONTINUE = process.argv[3] == "true";
let count = 0;

const getFeed = async (username, nextToken) => {
  try {
    let url = `https://instagram-profile1.p.rapidapi.com/getfeed/${username}`;
    if (nextToken) {
      url = `https://instagram-profile1.p.rapidapi.com/getfeed/${username}?next=${nextToken}`;
    }
    const options = {
      method: "GET",
      url,
      headers: {
        "x-rapidapi-host": HOST,
        "x-rapidapi-key": API_KEY,
      },
    };
    const result = await axios.request(options);
    return result;
  } catch (error) {
    console.log(error);
  }
};

const writeFile = async (result, next) => {
  fs.readFile(`result_${WHO_TO_FETCH}.json`, "utf8", (err, data) => {
    if (err) {
      console.log("error read");
      throw err;
    }

    let read = JSON.parse(data);
    if (read.media && count > 1) {
      read.media = [...read.media, ...result.media];
      read.page_info = result.page_info;
      read.status = count;
    } else {
      read = result;
    }

    const write = JSON.stringify(read, null, 2);
    fs.writeFile(`result_${WHO_TO_FETCH}.json`, write, "utf8", (err) => {
      if (err) {
        console.log("error write");
        throw err;
      }
      console.log("The file has been saved!", read.media.length);

      if (read.count > read.media.length && result.page_info.has_next_page) {
        next({
          page: result.page_info.next,
          username: WHO_TO_FETCH,
        });
      } else {
        console.log(
          `Success fetch ${WHO_TO_FETCH}. Count media: ${read.media.length}`
        );
      }
    });
  });
};

const nextPage = async ({ page, username }) => {
  try {
    const nextRequestBody = { page, username };
    console.log(count, nextRequestBody.page);
    const result = await getFeed(username, page);
    count++;
    writeFile(result.data, nextPage);
  } catch (err) {
    console.log(err);
  }
};

const main = async () => {
  if (!process.argv[2]) {
    console.log("please input proper username");
    return false;
  }

  if (CONTINUE) {
    fs.readFile(`result_${WHO_TO_FETCH}.json`, "utf8", (err, data) => {
      const read = JSON.parse(data);
      count = Number(read.status);
      nextPage({
        page: read.has_next_page.next,
        username: WHO_TO_FETCH,
      });
    });
  } else {
    // initial
    try {
      const result = await getFeed(WHO_TO_FETCH);
      fs.writeFile(`result_${WHO_TO_FETCH}.json`, "{}", "utf8", (err) => {
        count++;
        writeFile(result.data, nextPage);
      });
    } catch (err) {
      console.log(err, "error fetch 1st");
    }
  }
};

main();
