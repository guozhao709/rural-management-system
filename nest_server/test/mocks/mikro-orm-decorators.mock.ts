const noopDecorator = (): ClassDecorator & PropertyDecorator => () => undefined;

export const Entity = noopDecorator;
export const Index = noopDecorator;
export const PrimaryKey = noopDecorator;
export const Property = noopDecorator;
