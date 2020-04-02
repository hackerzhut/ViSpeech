import { Injectable, Logger } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { CalledAsrEvent } from "requests/events/impl/call-asr.event";
import { Observable } from "rxjs";
import { map, flatMap } from "rxjs/operators";
import { UpdateTokenCommand } from "tokens/commands/impl/update-token.command";
import { CreateReportCommand } from "reports/commands/impl/create-report.command";
import { ReportDto } from "reports/dtos/reports.dto";

@Injectable()
export class CallAsrSagas {
    constructor() { }

    @Saga()
    callAsrServiceSaga = (events$: Observable<any>): Observable<ICommand> => {
        return events$.pipe(
            ofType(CalledAsrEvent),
            flatMap((event: CalledAsrEvent) => {
                Logger.log('Inside [RequestSagas] callAsrService Saga', 'RequestSagas');
                const { streamId, requestDto, tokenDto } = event;
                const report = new ReportDto(requestDto.duration, requestDto.createdDate, requestDto.tokenId)
                return [
                    new UpdateTokenCommand(streamId, tokenDto),
                    new CreateReportCommand(streamId, report)
                ];
            })
        );
    };
}