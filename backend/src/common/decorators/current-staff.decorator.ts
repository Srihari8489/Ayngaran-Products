import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentStaff = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const staff = request.staff;
  return data ? staff?.[data] : staff;
});
