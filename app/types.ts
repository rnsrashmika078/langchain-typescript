import { Message as LCMessage } from "@langchain/core/messages";

type TMessage = {
  additional_kwargs: {
    reasoning_content: string;
  };
  tool_call_id: string;
  invalid_tool_calls: [];
  tool_call_chunks: [
    {
      args: string;
      id: string;
      name: string;
      index: number;
      type: string;
    },
  ];
  tool_calls: [
    {
      args: object;
      id: string;
      name: string;
      type: string;
    },
  ];
  usage_metadata: {
    input_token_details: object;
    input_tokens: number;
    output_token_details: object;
    output_tokens: number;
    total_tokens: number;
  };
  status: string;
};

export interface ExtendedMessage extends LCMessage, TMessage {}
