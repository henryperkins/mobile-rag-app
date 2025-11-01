import type { NavigatorScreenParams } from "@react-navigation/native";

export type DocumentsStackParamList = {
  DocumentsHome: undefined;
  DocumentViewer: { id: string; title: string };
};

export type RootTabParamList = {
  Chat: undefined;
  Documents: NavigatorScreenParams<DocumentsStackParamList>;
  Search: undefined;
  Settings: undefined;
};
