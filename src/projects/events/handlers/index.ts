import {ProjectCreatedFailedHandler, ProjectCreatedHandler, ProjectCreatedSuccessHandler} from './project-created.handler';
import {ProjectUpdatedHandler, ProjectUpdatedSuccessHandler, ProjectUpdatedFailedHandler} from './project-updated.handler';
import {ProjectDeletedHandler, ProjectDeletedSuccessHandler, ProjectDeletedFailedHandler} from './project-deleted.handler';
import {ProjectWelcomedHandler} from './project-welcomed.handler';

export const EventHandlers = [
    // create
    ProjectCreatedHandler,
    ProjectCreatedSuccessHandler,
    ProjectCreatedFailedHandler,

    // update
    ProjectUpdatedHandler,
    ProjectUpdatedSuccessHandler,
    ProjectUpdatedFailedHandler,

    // delete
    ProjectDeletedHandler,
    ProjectDeletedSuccessHandler,
    ProjectDeletedFailedHandler,

    ProjectWelcomedHandler,
];
