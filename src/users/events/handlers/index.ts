import {UserDeletedFailedHandler, UserDeletedHandler, UserDeletedSuccessHandler} from './user-deleted.handler';
import {UserUpdatedFailedHandler, UserUpdatedHandler, UserUpdatedSuccessHandler} from './user-updated.handler';
import {UserCreatedFailedHandler, UserCreatedHandler, UserCreatedSuccessHandler, UserCreationStartedHandler} from './user-created.handler';
import {UserWelcomedHandler} from './user-welcomed.handler';
import {PasswordChangedHandler, PasswordChangedSuccessHandler, PasswordChangedFailedHandler} from './password-changed.handler';
import {VerifyEmailSentFailedHandler, VerifyEmailSentHandler, VerifyEmailSentSuccessHandler} from './verify-email-sent.handler';
import {EmailVerifiedHandler, EmailVerifiedSuccessHandler, EmailVerifiedFailedHandler} from './email-verified.handler';

export const EventHandlers = [
    // create
    UserCreationStartedHandler,
    UserCreatedHandler,
    UserCreatedSuccessHandler,
    UserCreatedFailedHandler,

    // update
    UserUpdatedHandler,
    UserUpdatedSuccessHandler,
    UserUpdatedFailedHandler,

    // change password
    PasswordChangedHandler,
    PasswordChangedSuccessHandler,
    PasswordChangedFailedHandler,

    // delete
    UserDeletedHandler,
    UserDeletedSuccessHandler,
    UserDeletedFailedHandler,

    // welcome
    UserWelcomedHandler,

    // send verify email
    VerifyEmailSentHandler,
    VerifyEmailSentSuccessHandler,
    VerifyEmailSentFailedHandler,

    // verify email
    EmailVerifiedHandler,
    EmailVerifiedSuccessHandler,
    EmailVerifiedFailedHandler
];
