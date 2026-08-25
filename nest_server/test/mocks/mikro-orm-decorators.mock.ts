const noopDecorator = (): ClassDecorator & PropertyDecorator => () => undefined;

export const Entity = noopDecorator;
export const Index = noopDecorator;
export const PrimaryKey = noopDecorator;
export const Property = noopDecorator;
export const ManyToOne = noopDecorator;
export const OneToMany = noopDecorator;
export const ManyToMany = noopDecorator;
