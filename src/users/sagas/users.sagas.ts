import {Injectable, Logger} from "@nestjs/common";
import {ICommand, ofType, Saga} from "@nestjs/cqrs";
import {flatMap, map} from "rxjs/operators";
import {Observable} from "rxjs";
import {UserCreatedSuccessEvent, UserCreationStartedEvent} from "users/events/impl/user-created.event";
import {CreateFreeTokenCommand} from "tokens/commands/impl/create-token.command";
import {TokenDto} from "tokens/dtos/tokens.dto";
import {AuthService} from "auth/auth.service";
import {CreateUserCommand} from "users/commands/impl/create-user.command";
import {WelcomeUserCommand} from "users/commands/impl/welcome-user.command";
import {DeleteTokenCommand} from "tokens/commands/impl/delete-token.command";
import {FreeTokenCreatedFailEvent, FreeTokenCreatedSuccessEvent} from "tokens/events/impl/free-token-created.event";

@Injectable()
export class UsersSagas {
    constructor(private readonly authService: AuthService) {
    }

    @Saga()
    startCreatingUser = (events$: Observable<any>): Observable<ICommand> => {
        return events$.pipe(
            ofType(UserCreationStartedEvent),
            map((event: UserCreationStartedEvent) => {
                Logger.log("Inside [UsersSagas] startCreatingUser Saga", "UsersSagas");
                return new CreateUserCommand(event.userDto);
            })
        );
    };

    @Saga()
    userCreatedSucess = (events$: Observable<any>): Observable<ICommand> => {
        return events$.pipe(
            ofType(UserCreatedSuccessEvent),
            map((event: UserCreatedSuccessEvent) => {
                Logger.log("Inside [UsersSagas] userCreatedSucess Saga", "UsersSagas");
                const userId = event.userDto._id;
                const tokenValue = this.authService.generate_token_with_userId(userId);
                const tokenDto = new TokenDto(tokenValue, userId); // free token
                return new CreateFreeTokenCommand(tokenDto);
            })
        );
    };

    @Saga()
    freeTokenCreatedSuccess = (events$: Observable<any>): Observable<ICommand> => {
        return events$.pipe(
            ofType(FreeTokenCreatedSuccessEvent),
            map((event: FreeTokenCreatedSuccessEvent) => {
                Logger.log("Inside [UsersSagas] freeTokenCreatedSuccess Saga", "UsersSagas");
                const userId = event.tokenDto.userId;
                return new WelcomeUserCommand(userId);
            })
        );
    };

    @Saga()
    freeTokenCreatedFail = (events$: Observable<any>): Observable<ICommand> => {
        return events$.pipe(
            ofType(FreeTokenCreatedFailEvent),
            flatMap((event: FreeTokenCreatedFailEvent) => {
                Logger.log("Inside [UsersSagas] freeTokenCreatedFail Saga", "UsersSagas");

                return [
                    new DeleteTokenCommand(event.transactionId, null),
                ];
            })
        );
    };
}