import { answerHelpQuestion } from "../../src/lib/help-answer";

export default class HelpAnswerProvider {
  id() {
    return "relaydesk:help-answer";
  }

  async callApi(prompt: string) {
    return { output: JSON.stringify(answerHelpQuestion(prompt)) };
  }
}
