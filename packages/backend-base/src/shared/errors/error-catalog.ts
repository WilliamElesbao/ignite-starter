export type ErrorDefinition = {
  message: string;
  status: number;
};

export type ErrorCatalog<TCode extends string> = Record<TCode, ErrorDefinition>;
