import { ICommand } from "@nestjs/cqrs";
import { UserIdRequestParamsDto } from "users/dtos/users.dto";

export class DeleteUserCommand implements ICommand {
  constructor(public readonly transactionId: string, public readonly userIdDto: UserIdRequestParamsDto) {}
}
