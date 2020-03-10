import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { UserUpdatedEvent } from "../impl/user-updated.event";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "users/dtos/users.dto";
import { Repository } from "typeorm";
import { Utils } from "utils";
import { RoleDto } from "roles/dtos/roles.dto";
import { CONSTANTS } from "common/constant";

@EventsHandler(UserUpdatedEvent)
export class UserUpdatedHandler implements IEventHandler<UserUpdatedEvent> {
  constructor(
    @InjectRepository(UserDto) private readonly repository: Repository<UserDto>
  ) { }

  async handle(event: UserUpdatedEvent) {
    try {
      Logger.log(event, "UserUpdatedEvent");
      const { _id, ...userInfo } = event.userDto;
      const updatedBy = event.updatedBy;
      const roles = event.roles;
      if (updatedBy !== _id) {
        if (!roles.includes(CONSTANTS.ROLE.ADMIN)) {
          const user = await this.repository.findOne(_id);
          if (user.assignerId !== updatedBy) {
            // TODO: kafka throw unauthorize
            return null;
          }
        }
      }
      const formattedRoles = Utils.formatUserRoles(userInfo.roles);
      userInfo.roles = formattedRoles.map(role => new RoleDto(role.name));
      userInfo.roles.forEach(role => delete role._id);
      return await this.repository.update({ _id }, userInfo);
    } catch (error) {
      Logger.error(error, "", "UserUpdatedEvent");
    }
  }
}
