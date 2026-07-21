const token = localStorage.getItem("token");

// 流式请求数据
export const requestAIchatStream = async (
  userId: number,
  prompt: string,
  callback: (str: string) => void,
) => {
  const res = await fetch("http://127.0.0.1:3000/api/v1/user/AIchat/mainAIchat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId: userId,
      prompt: prompt,
    }),
  });

  const reader = res.body?.getReader();

  const decoder = new TextDecoder("utf-8");

  const parseLine = (line: string) => {
    if (line.startsWith("data: ")) {
      const jsonStr = line.slice(6); // 去掉 "data: " 前缀
      try {
        const data = JSON.parse(jsonStr);
        str += data.content || "";
        callback(str);
      } catch (e) {
        console.warn("JSON 解析失败（可能是不完整块）：", e);
      }
    }
  };

  let str = "";
  let leftover = ""; // 缓存不完整的行
  // 流式接受数据
  while (true) {
    const { done, value } = await reader!.read();

    if (done) {
      console.log("接受数据完毕");
      const finalChunk = decoder.decode();
      if (finalChunk) {
        leftover += finalChunk;
      }

      if (leftover.trim()) {
        parseLine(leftover);
      }

      break;
    }

    const chunk = decoder.decode(value, { stream: true });

    const lines = chunk.split("\n");
    leftover = lines.pop() || ""; // 最后一行可能不完整，缓存起来

    console.log(chunk);

    lines.forEach((line) => {
      if (!line.trim()) return; // 跳过空行
      parseLine(line);
    });
  }
};
