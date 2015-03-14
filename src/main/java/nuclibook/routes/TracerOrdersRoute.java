package nuclibook.routes;

import nuclibook.constants.P;
import nuclibook.entity_utils.SecurityUtils;
import nuclibook.entity_utils.TracerOrderUtils;
import nuclibook.models.TracerOrder;
import nuclibook.server.HtmlRenderer;
import org.joda.time.DateTime;
import spark.Request;
import spark.Response;

import java.util.ArrayList;
import java.util.List;

public class TracerOrdersRoute extends DefaultRoute {

	@Override
	public Object handle(Request request, Response response) throws Exception {
		// necessary prelim routine
		prepareToHandle();

		// security check
		if (!SecurityUtils.requirePermission(P.VIEW_TRACERS, response)) return null;

		// mode?
		String mode = request.queryParams("mode");
		ArrayList<String> modes = new ArrayList<String>() {{
			add("show-all");
			add("pending-only");
			add("order-today");
			add("order-tomorrow");
		}};
		if (mode == null || !modes.contains(mode)) {
			mode = "pending-only";
		}

		// start renderer
		HtmlRenderer renderer = getRenderer();
		renderer.setTemplateFile("tracer-orders.html");

		// get tracers and add to renderer
		List<TracerOrder> allTracerOrders = null;
		switch (mode) {
			case "show-all":
				allTracerOrders = TracerOrderUtils.getAllTracerOrders(false);
				break;

			case "pending-only":
				allTracerOrders = TracerOrderUtils.getAllTracerOrders(true);
				break;

			case "order-today":
				allTracerOrders = TracerOrderUtils.getTracerOrdersRequiredByDay(new DateTime());
				break;

			case "order-tomorrow":
				allTracerOrders = TracerOrderUtils.getTracerOrdersRequiredByDay((new DateTime()).plusDays(1));
				break;

		}
		renderer.setCollection("tracer-orders", allTracerOrders);

		// mode field
		renderer.setField("mode", mode);

		return renderer.render();
	}
}